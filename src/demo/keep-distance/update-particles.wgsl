#include "data-structs.wgsl"

struct MyUniform {
    view: mat4x4<f32>,
    blub: vec4<f32>
}

@binding(0) @group(0) var<storage, read> particlesA : Particles;
@binding(1) @group(0) var<storage, read_write> particlesB : Particles;
@binding(2) @group(0) var <uniform> myUniform: MyUniform;
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {

	var index = GlobalInvocationID.x;
	var vPos = particlesA.particles[index].pos;
	var vVel = particlesA.particles[index].vel;
	var vForce = particlesA.particles[index].force;
	var pos : vec2<f32>;

	var v = myUniform.blub.x * 0;


	var offset: vec2<f32> = vec2(0);

	// OLD SYSTEM
//	/*
	for (var i = 0u; i < arrayLength(&particlesA.particles) - 1; i++) {
		if (i == index) {
			continue;
		}

		pos = particlesA.particles[i].pos.xy;
		var dis = distance(pos, vPos) + 0.0001;
		var force = ((0.5 - 0.5 * myUniform.blub.w) / myUniform.blub.z) / pow(dis, 2);
		var vv = (pos - vPos) * force *  0.0000001;


		offset += vv;
	}

	// Wrap around boundary
	var box = 10.0;
	if (vPos.x < -box) {
		//vPos.x += box * 2;
		vVel.x += 0.00001;
		//vForce = vec2(0);
		//offset = vec2(0);
		//vVel = vec2(0);
	}
	if (vPos.x > box) {
		//vPos.x -= box * 2;
		vVel.x -= 0.00001;
		//vForce = vec2(0);
		//offset = vec2(0);
		//vVel = vec2(0);
	}
	if (vPos.y < -box) {
		//vPos.y += box * 2;
		vVel.y += 0.00001;
		//vForce = vec2(0);
		//offset = vec2(0);
		//vVel = vec2(0);
	}
	if (vPos.y > box) {
		//vPos.y -= box * 2;
		vVel.y -= 0.00001;
		//vForce = vec2(0);
		//offset = vec2(0);
		//vVel = vec2(0);
	}

	vForce += offset;
	vVel += vForce;

	// Write back
	vForce *= 0.25;
	if (myUniform.blub.w > 0.5) {
		vForce *= 0.0;
		if (length(vVel) > 0.0001) {
			vVel *= 0.99;
		} else {
			//vVel *= 1.01;
		}
	} else {
		if (length(vVel) > 0.02) {
			vVel *= 0.9;
		} else {
			//vVel *= 2;
		}
	}

    vPos += vVel;

    // Write back
    particlesB.particles[index].vel = vVel;
	particlesB.particles[index].pos = vPos;
	particlesB.particles[index].force = vForce;

}
