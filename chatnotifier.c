#include <stdio.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <linux/un.h>
#include <unistd.h>
#include <string.h>
#include <stdlib.h>
#include <signal.h>
#include <stdbool.h>

int conn_fd;

static void handle_usr1 () {
  ssize_t wr;
  while ((wr = write(conn_fd, ".", 1)) != 1) {
    if (wr < 0) exit(EXIT_FAILURE);
  }
}

static void dead_child (int signum) {
  /* fuck it before it gets cold */
  wait();
}

static void handle_usr1_central () {
  fprintf(stderr, "post\n");
}

int handle_connection (int connection_fd) {
  /* we are now in another process, so we can add a signal handler */
  conn_fd = connection_fd;
  signal(SIGUSR1, handle_usr1);

  /* struct sigaction fuck; */
  /* memset (&fuck, 0, sizeof(fuck)); */
  /* fuck.sa_handler = SIG_IGN; */
  /* fuck.sa_flags = SA_NOCLDWAIT; */
  /* sigaction(SIGCHLD, &fuck, &fuck); */

  ssize_t rd;
  char ignore[1];
  while ((rd = read(conn_fd, ignore, sizeof(ignore))) > 0) {
    killpg(0, SIGUSR1);
  }
  if (rd < 0) {
    exit(EXIT_FAILURE);
  } else {
    exit(EXIT_SUCCESS);
  }
}

int main (void) {

  signal(SIGUSR1, handle_usr1_central);
  signal(SIGCHLD, dead_child);

  if (setpgid(0,0) != 0) {
    fprintf(stderr, "setpgid() failed\n");
    exit(EXIT_FAILURE);
  }

  struct sockaddr_un address;
  memset(&address, 0, sizeof(struct sockaddr_un));
  int socket_fd, connection_fd;
  socklen_t address_length;
  char* socketpath = "/tmp/chat.sock";
  pid_t child;

  if ((socket_fd = socket(PF_UNIX, SOCK_STREAM, 0)) < 0) {
    fprintf(stderr, "socket() failed\n");
    exit(EXIT_FAILURE);
  }

  unlink(socketpath);

  address.sun_family = AF_UNIX;
  snprintf(address.sun_path, UNIX_PATH_MAX, "%s", socketpath);

  if (bind(socket_fd, (struct sockaddr*) &address,
  	   sizeof(struct sockaddr_un)) != 0) {
    fprintf(stderr, "bind() failed\n");
    exit(EXIT_FAILURE);
  }

  if (listen (socket_fd, 10) != 0) {
    fprintf(stderr, "listen() failed\n");
    exit(EXIT_FAILURE);
  }


  while ((connection_fd = accept(socket_fd, (struct sockaddr*) &address,
  				 &address_length)) > -1) {
    child = fork();
    if (child < 0) {
      fprintf(stderr, "fork() failed\n");
      exit(EXIT_FAILURE);
    } else if (child == 0) {
      return handle_connection(connection_fd);
    }
    close(connection_fd);
  }

  /* TODO: atexit */
  close(socket_fd);
  unlink(socketpath);
  return EXIT_SUCCESS;
}
