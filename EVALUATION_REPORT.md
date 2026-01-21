# Local LLM Integration: Technical Evaluation & Recommendation

## Executive Summary

After evaluating the leading runtime options against your constraints (Cross-platform parity, Offline capability, Hardware Acceleration, Tauri/Rust integration), two clear candidates emerge.

*   **Primary Recommendation**: **llama.cpp** (via Rust bindings). It offers the best balance of single-file model UX (GGUF), mature hardware acceleration (Metal/Vulkan/CUDA), and ease of integration.
*   **Backup Strategy**: **ONNX Runtime (GenAI)**. It provides superior NPU access (NNAPI) but comes with higher complexity in model management and runtime distribution.

---

## 1. Comparative Analysis

| Feature | **llama.cpp** | **ONNX Runtime (ORT)** | **MLC LLM (TVM)** | **Ratchet (WebGPU)** |
| :--- | :--- | :--- | :--- | :--- |
| **Desktop Support** | ✅ (Win/Mac/Lin) | ✅ (All) | ✅ (All) | ✅ (All) |
| **Mobile Support** | ✅ (iOS/Android) | ✅ (iOS/Android) | ✅ (iOS/Android) | ⚠️ (Android WebGPU varies) |
| **Backend (Apple)** | Metal (Native) | CoreML / Metal | Metal | WebGPU (Metal) |
| **Backend (Android)** | Vulkan / CPU | NNAPI / QNN / CPU | Vulkan / OpenCL | WebGPU (Vulkan) |
| **NPU Support** | ⚠️ Partial (via dedicated backends) | ✅ Strong (NNAPI/CoreML) | ⚠️ Compilation required | ❌ No direct NPU |
| **Model Format** | **GGUF** (Single File) | ONNX (Folder/Files) | Compiled Libs + Weights | GGUF / SafeTensor |
| **Arbitrary Models** | ✅ Excellent (Drag & Drop) | ⚠️ Good (Needs conversion) | ❌ Poor (Needs compile) | ✅ Good |
| **Runtime Size** | ~2-5 MB (Static) | ~20-50 MB (Dynamic) | ~5-10 MB | ~5 MB |
| **Rust Integration** | ✅ `llama-cpp-2` | ✅ `ort` crate | ⚠️ C++ mostly | ✅ Native Rust |
| **Tauri Mobile** | ✅ Static Linking | ✅ Static/Dynamic | ⚠️ Complex | ✅ Native |

### ❌ Disqualified Options

*   **Candle (HuggingFace)**: While promising and pure Rust, its **Android GPU/NPU support** lags significantly behind `llama.cpp` and `ORT`. It does not meet the "No Feature Disparity" constraint for mobile performance.
*   **ExecuTorch**: Too experimental and heavy for a generic "model viewer" app; requires specific model preprocessing.

---

## 2. Technical Analysis of Top Candidates

### Option A: llama.cpp (Primary Recommendation)

The *de facto* standard for local LLMs. It uses custom kernels (Metal, CUDA, Vulkan) rather than relying on OS-level APIs like CoreML/NNAPI, ensuring consistent behavior.

*   **Strengths**:
    *   **GGUF Format**: The industry standard for portable models. Users can download a single file from HuggingFace and run it. No "folders" or config hell.
    *   **Apple Silicon Parity**: Its Metal backend is exceptionally optimized, often beating CoreML in flexibility.
    *   **Android Parity**: Uses Vulkan for GPU acceleration. While not using the NPU (NNAPI) by default, modern Android GPUs (Adreno/Mali) are often faster than NPUs for LLMs anyway.
    *   **Tauri Integration**: Can be statically linked into the Tauri binary, solving the iOS App Store distribution rule.

*   **Weaknesses**:
    *   **NPU Access**: Does not deeply integrate with Android NNAPI or Windows NPU (yet). It relies on raw compute (CPU/GPU).
    *   **Granularity**: Manual overrides are usually "Layers to GPU" (0-100%). You cannot easily say "Run Layer 1 on NPU, Layer 2 on GPU" without deeper code changes.

### Option B: ONNX Runtime (Backup)

The corporate/standard approach. Uses execution providers (EPs) to delegate to hardware.

*   **Strengths**:
    *   **Hardware Access**: Best-in-class support for generic NPUs (Android NNAPI, Qualcomm QNN, Apple CoreML).
    *   **Granular Control**: You can explicitly select which Execution Provider to use for a session.

*   **Weaknesses**:
    *   **Model UX**: ONNX models are multi-file (weights + graph). Converting GGUF -> ONNX is not user-friendly. Users must download pre-converted ONNX models.
    *   **Binary Size**: The `onnxruntime` shared library is massive. Statically linking it on mobile is possible but bloats the app size significantly.
    *   **Complexity**: Configuring EPs for cross-platform parity is difficult (e.g., handling unsupported operators on NNAPI).

### Option C: Ratchet (Emerging / Wildcard)

A Rust-native, WebGPU-first runtime.

*   **Strengths**: True "Write Once, Run Everywhere" via `wgpu`. Native Rust (no C++ FFI headaches). Supports GGUF.
*   **Weaknesses**: Android WebGPU support is still maturing. Performance is generally 80-90% of native Metal/CUDA.
*   **Verdict**: Keep on radar, but `llama.cpp` is safer for production today.

---

## 3. Implementation Strategy for Tauri

To meet your requirements (Offline, Hardware Override, App Store Compliance), here is the recommended architecture:

### 1. The Core: `llama.cpp` via FFI
Use the **`llama-cpp-2`** Rust bindings. This allows you to interact with the C++ engine safely from Rust.

*   **Linking**:
    *   **iOS/Android**: Enable **Static Linking** features in the crate. This builds `libllama.a` and bundles it into your main app binary. This is **App Store compliant**.
    *   **Desktop**: You can bundle the dynamic lib (`llama.dll`/`.so`/`.dylib`) or statically link. Static linking is preferred for "single binary" distribution.

### 2. Hardware Acceleration Logic
You must implement a "Device Manager" in Rust that maps user preferences to `llama.cpp` params.

*   **Auto (Default)**:
    *   Detect OS.
    *   If macOS: Enable `Metal`.
    *   If Windows/Linux + NVIDIA: Enable `CUDA`.
    *   If Android: Enable `Vulkan`.
    *   Fallback: CPU (with threading optimized for Performance Cores).
*   **Manual Override**:
    *   Expose a setting: "Inference Backend".
    *   Options: `CPU`, `Metal` (Mac/iOS), `Vulkan` (Android/Win/Lin), `CUDA` (Desktop).
    *   *Note*: `llama.cpp` handles the low-level device enumeration. You pass the flag `n_gpu_layers` to offload work.

### 3. Model Management
*   **Download**: Use Rust's `reqwest` to download GGUF files to `app_data_dir`.
*   **Storage**: Store models in a persistent local directory.
*   **Loading**: Pass the file path to `llama_backend_init_from_file`.

---

## 4. Final Recommendation

**Go with `llama.cpp`.**

**Why?**
1.  **Parity**: GGUF works everywhere. You don't need to explain to users why "Model X works on PC but not Mobile".
2.  **UX**: Single-file models are superior for end-users compared to ONNX folders.
3.  **Tauri/Mobile**: Static linking support is mature, ensuring painless iOS App Store approval.
4.  **Performance**: Metal (iOS) and Vulkan (Android) backends are production-ready.

**Next Steps:**
1.  Add `llama-cpp-2` to your `Cargo.toml`.
2.  Configure `build.rs` to enable `vulkan` feature for Android and `metal` for iOS.
3.  Write a simple Rust test to load a dummy GGUF and run one token generation.
