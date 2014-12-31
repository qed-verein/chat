var svg = document.documentElement;
var dt = 0.04;

var counter = 0;
var particles = new Array();
var gravity = 30;
var fireTimer = 0.0;
function init()
{
	setInterval('update()', dt * 1000);
}

function update()
{
	fireTimer -= dt;
	if(fireTimer <= 0.0 && particles.length <= 100)
	{
		fireTimer = Math.random() * 2;
		fire();
	}

	for(id in particles)
	{
		var pt = particles[id];
		pt['x'] += pt['vx'] * dt;
		pt['y'] += pt['vy'] * dt;

		if(pt['state'] == 'smoke')
			pt['vy'] += gravity * dt * 0.3;
		else if(pt['state'] == 'fragment')
			pt['vy'] += gravity * dt;
	
		pt['t'] += dt;
		if(pt['t'] >= pt['lifetime'] && pt['state'] == 'rocket')
			boom(id);

		if(pt['state'] == 'rocket' && Math.random() < dt / 0.1)
			smoke(id);
		if(pt['t'] >= pt['lifetime'])
			pt['state'] = 'none';
			
		//if(pt['t'] >= 2.0 && pt['s'] == 2)
			
		
			
			//pt['alive'] = false;
		node = svg.getElementById(id);
		node.setAttribute('cx', Math.floor(pt['x']));
		node.setAttribute('cy', Math.floor(pt['y']));
		if(pt['state'] == 'rocket')
			node.setAttribute('r', 8);
		else if(pt['state'] == 'fragment')
			node.setAttribute('r', 4);
		else if(pt['state'] == 'smoke')
			node.setAttribute('r', 4 + pt['t'] / pt['lifetime'] * 10);
		opacity = 1.0;
		if(pt['state'] == 'fragment' || pt['state'] == 'smoke')
			opacity = Math.min(1.0, 1.0 - pt['t'] / pt['lifetime']);
		color = 'rgb(' + Math.floor(pt['color'][0]) + ',' +
			Math.floor(pt['color'][1]) + ',' +
			Math.floor(pt['color'][2]) + ')';
		node.setAttribute('style', 'fill: ' + color + ';' + 'fill-opacity:' + opacity);
	}
	
	for(id in particles)
		if(particles[id]['state'] == 'none')
		{
			svg.getElementById(id).remove();
			delete particles[id]; 
		}
			
	//pt = svg.getElementById('a');
	//r = Math.floor(Math.random() * 255);
	//g = Math.floor(Math.random() * 255);
	//b = Math.floor(Math.random() * 255);
	//fill = 'rgb(' + r + ',' + g + ',' + b + ')';
	//pt.setAttribute('style', 'fill: ' + fill);
	//x = Math.random() * window.innerWidth;
	//y = Math.random();
	
}


function smoke(id)
{
	var pt = particles[id];
	var npt = new Array();
	npt['x'] = pt['x'];
	npt['y'] = pt['y'];
	npt['vx'] = Math.random() * 2.0 - 1.0;
	npt['vy'] = Math.random() * 2.0 - 1.0;
	var factor = 5.0 / Math.hypot(npt['vx'], npt['vy']) * Math.random();
	npt['vx'] *= factor; npt['vy'] *= factor;
	npt['t'] = 0;
	npt['state'] = 'smoke'
	r = 25.0 + Math.random() * 25.0;
	g = 25.0 + Math.random() * 25.0;
	b = 25.0 + Math.random() * 25.0;
	npt['color'] = [r, g, b];
	npt['lifetime'] = Math.random() * 1 + 1;
	add(npt);
	
}

function boom(id)
{
	var pt = particles[id];
	
	for(i = 0; i < pt['parts']; ++i)
	{
		var npt = new Array();
		npt['x'] = pt['x'];
		npt['y'] = pt['y'];
		npt['vx'] = Math.random() * 2.0 - 1.0;
		npt['vy'] = Math.random() * 2.0 - 1.0;
		var factor = 100.0 / Math.hypot(npt['vx'], npt['vy']) * Math.random();
		npt['vx'] *= factor; npt['vy'] *= factor;
		npt['vx'] += pt['vx'] * 0.5; npt['vy'] += pt['vy'] * 0.5;
		npt['t'] = 0;
		npt['state'] = 'fragment'
		npt['color'] = pt['color'];
		npt['lifetime'] = Math.random() * 2 + 1;
		add(npt);
	}

	pt['state'] = 'none';
}

function fire()
{	
	var pt = new Array();
	pt['state'] = 'rocket';
	pt['x'] = Math.random() * window.innerWidth;
	pt['y'] = window.innerHeight;
	pt['vx'] = Math.random() * 100 - 50;
	pt['vy'] = Math.random() * 50 - 150;
	pt['t'] = 0;
	pt['lifetime'] = Math.random() * 3.0 + 1.0;
	pt['parts'] = Math.random() * 40 + 10;
	pt['alive'] = true;

	r = Math.random();
	g = Math.random();
	b = Math.random();
	f = 255 / Math.sqrt(r*r + g*g + b*b + 1e-6);
	pt['color'] = [r * f, g * f, b * f];
	add(pt);
}

function add(pt)
{
	var id = 'particle-' + counter;
	counter += 1;
	particles[id] = pt;
	svgns = "http://www.w3.org/2000/svg";
	node = document.createElementNS(svgns, 'circle');
	node.id = id;
	svg.getElementById('particles').appendChild(node);
}
