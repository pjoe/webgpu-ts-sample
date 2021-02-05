document!.getElementById("app")!.innerHTML = `
<h1>Hello WebGPU</h1>
<div>
  <canvas id="webgpu-canvas" width="800" height="600"/>
</div>
`;

const vertShader = `
const pos : array<vec2<f32>, 3> = array<vec2<f32>, 3>(
  vec2<f32>(0.0, 0.5),
  vec2<f32>(-0.5, -0.5),
  vec2<f32>(0.5, -0.5));

[[builtin(position)]] var<out> Position : vec4<f32>;
[[builtin(vertex_index)]] var<in> VertexIndex : i32;

[[stage(vertex)]]
fn main() -> void {
Position = vec4<f32>(pos[VertexIndex], 0.0, 1.0);
return;
}
`;

const fragShader = `
[[location(0)]] var<out> outColor : vec4<f32>;

[[stage(fragment)]]
fn main() -> void {
  outColor = vec4<f32>(1.0, 0.0, 0.0, 1.0);
  return;
}
`;

async function setup() {
  if (!navigator.gpu) {
    throw new Error("WebGPU not supported");
  }
  const adapter = await navigator.gpu.requestAdapter({
    powerPreference: "high-performance",
  });
  if (!adapter) {
    throw new Error("Can't get adapter");
  }
  const device = await adapter.requestDevice();
  if (!device) {
    throw new Error("Can't get device");
  }

  console.log("device", device);

  const canvas = document.getElementById("webgpu-canvas");
  if (!canvas) {
    throw new Error("Can't get canvas");
  }
  const context = (canvas as HTMLCanvasElement).getContext("gpupresent");
  if (!context) {
    throw new Error("Can't get context from canvas");
  }
  const swapChainFormat: GPUTextureFormat = "bgra8unorm";
  const swapChain = context.configureSwapChain({
    device,
    format: swapChainFormat,
    // usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  const pipeline = device.createRenderPipeline({
    vertexStage: {
      module: device.createShaderModule({
        code: vertShader,
      }),
      entryPoint: "main",
    },
    fragmentStage: {
      module: device.createShaderModule({
        code: fragShader,
      }),
      entryPoint: "main",
    },
    primitiveTopology: "triangle-list",
    colorStates: [
      {
        format: swapChainFormat,
      },
    ],
  });

  const frame = () => {
    const commandEncoder = device.createCommandEncoder();
    const textureView = swapChain.getCurrentTexture().createView();

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          attachment: textureView,
          loadValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        },
      ],
    };

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(pipeline);
    passEncoder.draw(3, 1, 0, 0);
    passEncoder.endPass();

    //TODO: defaultQueue renamed to queue
    device.defaultQueue.submit([commandEncoder.finish()]);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

async function main() {
  try {
    await setup();
  } catch (error) {
    alert(error);
  }
}

main();
