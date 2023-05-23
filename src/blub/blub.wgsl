
struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) color : vec4<f32>
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
    @location(1) pPos : vec2<f32>
) -> VertexOutput {

    var output : VertexOutput;
    output.position = myUniform.view * vec4<f32>(position.xy + pPos, 0.0, 1.0) ;
    output.color = vec4(1.0, 0.0, 0.0, 1.0);

  return output;
}

@fragment
fn frag_main() -> @location(0) vec4<f32> {
  return vec4(1.0, 0.0, 0.0, 1.0);
}