@binding(0) @group(0)var gBufferDistance: texture_2d<f32>;



@fragment
fn main(
	@builtin(position) coord : vec4f
) -> @location(0) vec4f {
	var result : vec4f;


	result = textureLoad(
		gBufferDistance,
		vec2i(floor(coord.xy) * vec2(0.125)),
		0
	);

//	 if (result.a > 0.01) {
//	 	result.x = 1.0 / result.a;
//	 	result.y = 1.0 / result.a;
//	 	result.z = 1.0 / result.a;
//	 }
//	 if (result.a > 1.01) {
	 	result = vec4(0.05 * result.a, 0.01 * result.a, 0.005 * result.a,1);
	 //}

	return result;
}