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
	pos : vec2<f32>
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
	var pos : vec2<f32>;

	var v = myUniform.blub.x * 0;

	init_rand(index, vec4(vPos, vPos.x + vPos.y,vPos.x * vPos.y));

	var offset: vec2<f32> = vec2(0);
	for (var i = 0u; i < arrayLength(&particlesA.particles) - 1; i++) {
		if (i == index) {
			continue;
		}

		pos = particlesA.particles[i].pos.xy;
		var dis = distance(pos, vPos);
		var force = 0.01 / pow(dis, 0.01);
		var vv = normalize( pos - vPos) * force * 0.001;

		if (dis > 0.25) {
			offset += vv;
		} else {
			offset -= vv * 10/ dis;
		}

	}

	// mouse
	var dis = distance(myUniform.blub.xy, vPos);
	var force = 0.01 / pow(dis, 0.01);
	var vv = normalize( myUniform.blub.xy - vPos) * force * 0.001;


	offset -= vv * 500/ dis;



	vPos = mix(vPos, vPos + clamp(offset, vec2(-0.1), vec2(0.1)), 0.5);

	// Wrap around boundary
	if (vPos.x < -1.5) {
		vPos.x = 1.5;
	}
	if (vPos.x > 1.5) {
		vPos.x = -1.5;
	}
	if (vPos.y < -1.5) {
		vPos.y = 1.5;
	}
	if (vPos.y > 1.5) {
		vPos.y = -1.5;
	}
	// Write back
	particlesB.particles[index].pos = vPos;
}
