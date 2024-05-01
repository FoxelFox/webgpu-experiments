struct MyUniform {
	view: mat4x4<f32>,
	blub: vec4<f32>,
	textureSize: f32,
	edgesTextureSize: f32,
	maxEdges: f32
}


@binding(0) @group(0) var distanceTexture: texture_2d<f32>;
@binding(1) @group(0) var output: texture_storage_2d<rgba32float, write>;
@binding(2) @group(0) var <uniform> myUniform: MyUniform;
@compute @workgroup_size(8,8,1)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {

	var u = myUniform;
	var factor = u32(myUniform.textureSize) / 128;
	var result: vec4<f32> = vec4(0);


	for (var x = 0u; x < factor; x++) {
		for (var y = 0u; y < factor; y++) {
			result += textureLoad(
				distanceTexture,
				GlobalInvocationID.xy * factor + vec2(x,y),
				0
			);
		}
	}


	textureStore(output, GlobalInvocationID.xy, result);
}