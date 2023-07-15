struct Particle {
	pos : vec2<f32>,
	vel: vec2<f32>
}

struct Particles {
	particles : array<Particle>,
}

struct Grid {
	size: vec2<f32>,
	cells: vec2<i32>,
	min: vec2<f32>,
	max: vec2<f32>,
	indeces: array <i32>
}


@binding(0) @group(0) var<storage, read> particlesA : Particles;
@binding(1) @group(0) var<storage, read_write> particlesB : Particles;
@binding(2) @group(0) var <uniform> params: MyUniform;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {

}
