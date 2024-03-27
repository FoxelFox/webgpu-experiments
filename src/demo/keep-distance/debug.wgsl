@group(0) @binding(0) var gBufferDistance: texture_2d<f32>;



@fragment
fn main(
	@builtin(position) coord : vec4f
) -> @location(0) vec4f {
	var result : vec4f;


	result = textureLoad(
		gBufferDistance,
		vec2i(floor(coord.xy)),
		0
	);

	return result;
}