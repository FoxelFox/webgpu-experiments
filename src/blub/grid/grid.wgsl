struct Particle {
	pos : vec2<f32>,
	vel: vec2<f32>
}

struct Particles {
	particles : array<Particle>,
}

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

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {

}
