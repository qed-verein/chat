#include <stdio.h>
#include <sys/select.h>
#include <stdbool.h>
#include <errno.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <linux/un.h>
#include <unistd.h>
#include <stdlib.h>
#include <string.h>

#define MAX_CONNS (4096)

static int sockets[MAX_CONNS]; /* open sockets */
static bool ack_sockets[MAX_CONNS]; /* sockets that still need to be notified */
static bool rm_sockets[MAX_CONNS]; /* sockets that need to be removed */
static int nsockets;
static int socket_fd; /* listening socket */

int main (void) {

  struct sockaddr_un address;
  memset(&address, 0, sizeof(struct sockaddr_un));
  int connection_fd;
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

  fd_set readfds, writefds, exceptfds;


  while (1) {
    FD_ZERO(&readfds); FD_ZERO(&writefds); FD_ZERO(&exceptfds);

    if (nsockets < MAX_CONNS) {
      /* dont accept if too many connections */
      FD_SET(socket_fd, &readfds);
      FD_SET(socket_fd, &exceptfds);
    }

    int i, j, sel, nfds = socket_fd;
    for (i = 0; i < nsockets; ++i) {
      FD_SET(sockets[i], &readfds);
      FD_SET(sockets[i], &exceptfds);
      if (ack_sockets[i]) FD_SET(sockets[i], &writefds);
      nfds = nfds < sockets[i] ? sockets[i] : nfds;
    }

    fprintf(stderr, "selecting ... ");

    sel = select(nfds+1, &readfds, &writefds, &exceptfds, NULL);
    if (sel == -1) perror("select() failed\n");

    fprintf(stderr, "returned %d events\n", sel);


    if (FD_ISSET(socket_fd, &exceptfds)) {
      fprintf(stderr, "Error in listening socket. Aborting.\n");
      exit(EXIT_FAILURE);
    }

    if (FD_ISSET(socket_fd, &readfds)) {
      fprintf(stderr, "new connection?\n");
      --sel;
      int connection_fd;
      if ((connection_fd = accept(socket_fd,
				  (struct sockaddr*) &address,
				  &address_length)) > -1) {
	fprintf(stderr, "new connection: %d\n", connection_fd);
	sockets[nsockets] = connection_fd;
	ack_sockets[nsockets] = false;
	nsockets++;
      }
    }

    bool ack = false;
    bool rm = false;
    for (j = 0; (j < nsockets); ++j) {
      if (sel == 0) break;
      if (FD_ISSET(sockets[j], &exceptfds)) {
	fprintf(stderr, "exceptfds from %d\n", sockets[j]);
	rm_sockets[j] = rm = true;
	continue;
      }
      if (sel == 0) break;
      if (FD_ISSET(sockets[j], &readfds)) {
	fprintf(stderr, "read from %d\n", sockets[j]);
	--sel;
	char rd;
	if (read (sockets[j], &rd, 1) <= 0) {
	  fprintf(stderr, "stream %d ends.\n", sockets[j]);
	  rm_sockets[j] = rm = true;
	  if (close(rm_sockets[j]) == -1) {
	    perror("close()");
	  }
	}
	ack = true;
      }
      if (sel == 0) break;
      if (ack_sockets[j] && FD_ISSET(sockets[j], &writefds)) {
	fprintf(stderr, "write to %d\n", sockets[j]);
	--sel;
	write(sockets[j], ".", 1);
	ack_sockets[j] = false;
      }
    }
    if (ack) {
      for (j = 0; j < nsockets; ++j) ack_sockets[j] = true;
    }
    if (rm) {
      int rsockets = 0;
      for (j = 0; j < nsockets; ++j) {
	if (!rm_sockets[j]) {
	  sockets[rsockets] = sockets[j];
	  ack_sockets[rsockets] = ack_sockets[j];
	  ++rsockets;
	}
      }
      nsockets = rsockets;
    }
  }
}
