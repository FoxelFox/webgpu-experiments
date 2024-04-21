@binding(0) @group(0)var gBufferDistance: texture_2d<f32>;

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

	 if (result.a > 0.01) {
	 	result.x = 1.0;
	 	result.y = 1.0;
	 	result.z = 1.0;
	 }
	 if (result.a > 0.11) {
	 	result = vec4(1,0,0,1);
	 }

	result.x = result.x;
	//result.y = 255;

	return result;
}