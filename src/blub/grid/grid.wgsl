
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


@binding(0) @group(0) var<storage, read_write> grid : Grid;
@binding(1) @group(0) var<storage, read> particles : Particles;
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
	var cell = grid.cells[GlobalInvocationID.x];
	cell.midpoint.x = grid.resolution.x;
	cell.midpoint.y = grid.resolution.y + 1;
	cell.mass = cell.mass + 1;

	grid.cells[GlobalInvocationID.x] = cell;
}
