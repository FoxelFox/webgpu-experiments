struct MyUniform {
    view: mat4x4<f32>,
    blub: vec4<f32>
}

struct Particle {
	pos : vec2<f32>,
	vel: vec2<f32>,
	force: vec2<f32>
}

struct Particles {
	particles : array<Particle>,
}

// TODO use import feature
struct Cell {
	midpoint: vec2<f32>,
	mass: f32
}

struct Grid {
	resolution: vec2<f32>,
	cells: array <Cell>
}

@binding(0) @group(0) var<storage, read> particlesA : Particles;
@binding(1) @group(0) var<storage, read_write> particlesB : Particles;
@binding(2) @group(0) var <uniform> myUniform: MyUniform;
@binding(3) @group(0) var<storage, read> gridA : Grid;
@binding(4) @group(0) var<storage, read_write> gridB : Grid;
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {

	var index = GlobalInvocationID.x;
	var vPos = particlesA.particles[index].pos;
	var vVel = particlesA.particles[index].vel;
	var vForce = particlesA.particles[index].force;
	var pos : vec2<f32>;
	var gridblub = gridA.resolution;
	var removeME = gridB.resolution;

	var v = myUniform.blub.x * 0;


	var offset: vec2<f32> = vec2(0);

	// OLD SYSTEM
	/*
	for (var i = 0u; i < arrayLength(&particlesA.particles) - 1; i++) {
		if (i == index) {
			continue;
		}

		pos = particlesA.particles[i].pos.xy;
		var dis = distance(pos, vPos) + 0.0001;
		var force = (1 / myUniform.blub.z) / pow(dis, 2);
		var vv = (pos - vPos) * force * 0.00000005;


		offset += vv;

		if (dis < 0.01) {
			vVel *=0.99999;
		}
	}
	*/

	// NEW SYSTEM
//	/*

	var gridIndex = floor((vPos.xy + vec2(1)) * (gridA.resolution / 2));
	var gridIndexSelf = u32(gridIndex.x + gridA.resolution.x * gridIndex.y);
	for (var i = 0u; i < arrayLength(&gridA.cells); i++) {

		var cell = gridA.cells[i];

		if (gridIndexSelf == i) {
			// remove self from mass
			cell.midpoint -= vPos;
			cell.mass -= 1;
		}

		if (cell.mass >= 1) {
			pos = cell.midpoint.xy / cell.mass;
			var dis = distance(pos, vPos) + 0.001;
			var force = (cell.mass / myUniform.blub.z) / pow(dis, 2);
			var vv = (pos - vPos) * force * 0.0000005;




			if (dis < 1.0) {
				offset -= vv;
			} else {
				offset += vv;
			}
		}
	}
//	*/

	// mouse
	var dis = distance(myUniform.blub.xy, vPos) + 0.01;
	var force = 0.001 / pow(pow(dis, 2), -1.5);
	var vv = normalize( myUniform.blub.xy - vPos) * force;

	if (myUniform.blub.w > 0.5) {
		if (dis < 0.1) {
			offset -= vv * 500/ dis;
		} else {
			offset += vv * 0.5/dis;
		}
	}


	// Wrap around boundary
	var box = 1.0;
	if (vPos.x < -box) {
		//vPos.x += box * 2;
		vVel.x += 0.0001;
		//vForce = vec2(0);
		//offset = vec2(0);
		//vVel = vec2(0);
	}
	if (vPos.x > box) {
		//vPos.x -= box * 2;
		vVel.x -= 0.0001;
		//vForce = vec2(0);
		//offset = vec2(0);
		//vVel = vec2(0);
	}
	if (vPos.y < -box) {
		//vPos.y += box * 2;
		vVel.y += 0.0001;
		//vForce = vec2(0);
		//offset = vec2(0);
		//vVel = vec2(0);
	}
	if (vPos.y > box) {
		//vPos.y -= box * 2;
		vVel.y -= 0.0001;
		//vForce = vec2(0);
		//offset = vec2(0);
		//vVel = vec2(0);
	}

	vForce += offset;
	vVel += vForce;

	// Write back
	vForce *= 0.5;
	vVel *= 0.97;
    vPos += vVel;

    // Write back
    particlesB.particles[index].vel = vVel;
	particlesB.particles[index].pos = vPos;
	particlesB.particles[index].force = vForce;
}
