// TODO use import feature
#include "../data-structs.wgsl"


@binding(0) @group(0) var<storage, read_write> grid : Grid;
@binding(1) @group(0) var<storage, read> particles : Particles;
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
	var cell = grid.cells[GlobalInvocationID.x];
	cell.midpoint = vec2(0);
	cell.mass = 0;

	var numParticles = arrayLength(&particles.particles);
	for (var i = 0u; i < numParticles; i++) {
		var particle = particles.particles[i];
		// transform
		var gridIndex = floor((particle.pos.xy + vec2(1)) * (grid.resolution / 2));

		if (u32(gridIndex.x + grid.resolution.x * gridIndex.y) == GlobalInvocationID.x) {
			cell.midpoint +=  particle.pos.xy;
			cell.mass += 1;
		}
	}

	grid.cells[GlobalInvocationID.x] = cell;
}
