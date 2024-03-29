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

	if (result.a < 0.101) {
		result = vec4(0);
	} else {
		result = vec4(1,0,0,1);
	}

	return result;
}