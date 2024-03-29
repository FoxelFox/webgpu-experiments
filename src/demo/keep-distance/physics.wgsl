#include "data-structs.wgsl"

struct MyUniform {
    view: mat4x4<f32>,
    blub: vec4<f32>
}

@binding(0) @group(0) var<storage, read> particlesA : Particles;
@binding(1) @group(0) var<storage, read_write> particlesB : Particles;
@binding(2) @group(0) var <uniform> myUniform: MyUniform;
@binding(3) @group(0) var distanceTexture: texture_2d<f32>;
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
//	for (var i = 0u; i < arrayLength(&particlesA.particles) - 1; i++) {
//		if (i == index) {
//			continue;
//		}
//
//		pos = particlesA.particles[i].pos.xy;
//		var dis = distance(pos, vPos) + 0.0001;
//		var force = ((0.5 - 0.5 * myUniform.blub.w) / myUniform.blub.z) / pow(dis, 2);
//		var vv = (pos - vPos) * force *  0.0000001;
//
//
//		offset += vv;
//	}




	var d = textureLoad(
		distanceTexture,
		vec2i((vPos * 0.5 + 0.5) * 1024.0),
		0
	);

	if (d.a > 0.101) {
		// there is another particle near


		var dis = distance(d.xy, vPos) + 0.0001;
		var force = 1 / pow(dis, 2);
		var vv = (d.xy - vPos) * force *  0.000001;


		offset += vv;
	}


	vForce = offset;
	vVel += vForce;

    vPos += vVel;
    vPos *= 0.99;

    // Write back
    particlesB.particles[index].vel = vVel;
	particlesB.particles[index].pos = vPos;
	particlesB.particles[index].force = vForce;

}
