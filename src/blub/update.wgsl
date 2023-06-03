////////////////////////////////////////////////////////////////////////////////
// Utilities
////////////////////////////////////////////////////////////////////////////////
var<private> rand_seed : vec2<f32>;

fn init_rand(invocation_id : u32, seed : vec4<f32>) {
	rand_seed = seed.xz;
	rand_seed = fract(rand_seed * cos(35.456+f32(invocation_id) * seed.yw));
	rand_seed = fract(rand_seed * cos(41.235+f32(invocation_id) * seed.xw));
}

fn rand() -> f32 {
	rand_seed.x = fract(cos(dot(rand_seed, vec2<f32>(23.14077926, 232.61690225))) * 136.8168);
	rand_seed.y = fract(cos(dot(rand_seed, vec2<f32>(54.47856553, 345.84153136))) * 534.7645);
	return rand_seed.y;
}


struct MyUniform {
    view: mat4x4<f32>,
    blub: vec4<f32>
}



struct Particle {
	pos : vec2<f32>,
	vel: vec2<f32>
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
	var pos : vec2<f32>;

	var v = myUniform.blub.x * 0;

	init_rand(index, vec4(vPos, vPos.x + vPos.y,vPos.x * vPos.y));

	var offset: vec2<f32> = vec2(0);
	for (var i = 0u; i < arrayLength(&particlesA.particles) - 1; i++) {
		if (i == index) {
			continue;
		}

		pos = particlesA.particles[i].pos.xy;
		var dis = max(distance(pos, vPos), 0.01);
		var force = 0.00001 / pow(dis, 2);
		var vv = normalize( pos - vPos) * force * 0.00001;

		if (dis > 0.25) {
			offset += vv;
		} else {
			offset -= vv * 10/ dis;
		}

	}

	// mouse
	var dis = distance(myUniform.blub.xy, vPos);
	var force = 0.01 / pow(dis, 2);
	var vv = normalize( myUniform.blub.xy - vPos) * force * 0.0001;


	offset -= vv * 2/ dis;


	vVel += offset;
	vVel = clamp(vVel, vec2(-0.01), vec2(0.01));


	// Wrap around boundary
	if (vPos.x < -1.0) {
		vVel.x += 0.0001;
	}
	if (vPos.x > 1.0) {
		vVel.x -= 0.0001;
	}
	if (vPos.y < -1.0) {
		vVel.y += 0.0001;
	}
	if (vPos.y > 1.0) {
		vVel.y -= 0.0001;
	}
	// Write back
	vVel *= 0.95;
    vPos += vVel;

    // Write back
    particlesB.particles[index].vel = vVel;
	particlesB.particles[index].pos = vPos;
}
