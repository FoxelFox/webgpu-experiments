
struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) color : vec4<f32>,
  @location(1) quad_pos : vec2<f32>, // -1..+1
}

struct MyUniform {
    view: mat4x4<f32>,
    blub: vec4<f32>
}

@binding(0) @group(0) var <uniform> myUniform: MyUniform;

@vertex
fn vert_main(
    @builtin(instance_index) instanceIdx : u32,
    @location(0) position : vec4<f32>,
    @location(1) velocity : vec4<f32>,
    @location(2) force : vec4<f32>,
    @location(3) pPos : vec2<f32>
) -> VertexOutput {

    var output : VertexOutput;
    output.position = myUniform.view * vec4<f32>(position.xy + pPos, 0.0, 1.0) ;
    output.color = vec4((velocity.xy * 25 + 0.2),length(force.xy) * 500 ,0.5);
	output.quad_pos = position.xy;
  return output;
}

@fragment
fn frag_main(in : VertexOutput) -> @location(0) vec4<f32> {
  var color = in.color;
  //var color = vec4(in.quad_pos * 5, 0,1);
  // Apply a circular particle alpha mask
  //color.a = color.a * max(1.0 - length(in.quad_pos * 400), 0.0);
  return color;
}
