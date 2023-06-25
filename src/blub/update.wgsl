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

	// mouse
//	var dis = distance(myUniform.blub.xy, vPos) + 0.01;
//	var force = 0.0001 / pow(pow(dis, 2), -1.5);
//	var vv = normalize( myUniform.blub.xy - vPos) * force;
//	offset += vv * 2/ dis;

	vForce += offset;
	vVel += vForce;
	//vVel = clamp(vVel, vec2(-0.025), vec2(0.025)); // like speed of light limit


	// Wrap around boundary
	var box = 1.0;
	if (vPos.x < -box) {
		vForce.x += 0.0001;
	}
	if (vPos.x > box) {
		vForce.x -= 0.0001;
	}
	if (vPos.y < -box) {
		vForce.y += 0.0001;
	}
	if (vPos.y > box) {
		vForce.y -= 0.0001;
	}
	// Write back
	vForce *= 0.0;
	//vVel *= 0.999;
    vPos += vVel;

    // Write back
    particlesB.particles[index].vel = vVel;
	particlesB.particles[index].pos = vPos;
	particlesB.particles[index].force = vForce;
}
