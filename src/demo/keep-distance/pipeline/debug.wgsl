@binding(0) @group(0)var gBufferDistance: texture_2d<f32>;
@binding(1) @group(0) var edges: texture_3d<f32>;
@binding(2) @group(0) var id: texture_2d<f32>;

@fragment
fn main(
	@builtin(position) coord : vec4f
) -> @location(0) vec4f {
	var result : vec4f;



    result = textureLoad(
        edges,
        vec3i(floor(vec3(0,coord.xy))),
        0
    );

    result.x = result.x / 256;
    result.y = result.y / 256;


	result = textureLoad(
		gBufferDistance,
		vec2i(floor(coord.xy)),
		0
	);

	result = textureLoad(
		id,
		vec2i(floor(coord.xy)),
		0
	);

	// if (result.a < 0.101) {
	// 	result = vec4(0);
	// } else {
	// 	result = vec4(result.xy,0,1);
	// }

	result.x = result.x;
	//result.y = 255;

	return result;
}