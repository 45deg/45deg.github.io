/// <reference lib="webworker" />

import type { BuildAtlasWorkerCommand, BuildAtlasWorkerDonePayload, BuildAtlasWorkerEvent } from './atlasBuildProtocol'
import type { AtlasMeta, BuildAtlasInput } from '../types'
import { loadWasmCore } from '../wasmCore'

const workerScope = self as DedicatedWorkerGlobalScope

let canceled = false

function uid(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function postEvent(message: BuildAtlasWorkerEvent, transfer?: Transferable[]): void {
  workerScope.postMessage(message, transfer ?? [])
}

function reportProgress(done: number, total: number, label: string): void {
  postEvent({ type: 'progress', done, total, label })
}

function ensureNotCanceled(): void {
  if (canceled) throw new Error('Tile build canceled')
}

async function fileToImageBitmap(file: File, width: number, height: number): Promise<ImageBitmap> {
  return createImageBitmap(file, { resizeWidth: width, resizeHeight: height, resizeQuality: 'high' })
}

function createMeta(input: BuildAtlasInput, tileCount: number, atlasCols: number, atlasRows: number, featureLength: number): AtlasMeta {
  const atlasWidth = atlasCols * input.tileWidth
  const atlasHeight = atlasRows * input.tileHeight
  return {
    id: uid(),
    name: input.name,
    createdAt: new Date().toISOString(),
    tileCount,
    tileWidth: input.tileWidth,
    tileHeight: input.tileHeight,
    tileSize: input.tileWidth,
    precision: input.precision,
    colorModel: input.colorModel,
    projectionMode: input.projectionMode,
    atlasCols,
    atlasRows,
    atlasGrid: atlasCols,
    atlasWidth,
    atlasHeight,
    featureLength,
    featureChannels: 3,
  }
}

function toArrayBuffer(buf: ArrayBufferLike): ArrayBuffer {
  if (buf instanceof ArrayBuffer) return buf
  const copy = new Uint8Array(buf.byteLength)
  copy.set(new Uint8Array(buf))
  return copy.buffer
}

async function buildAtlasInWorker(input: BuildAtlasInput): Promise<BuildAtlasWorkerDonePayload> {
  canceled = false
  ensureNotCanceled()
  const wasm = await loadWasmCore()
  const tileCount = input.files.length
  const atlasCols = Math.max(1, Math.ceil(Math.sqrt(tileCount)))
  const atlasRows = Math.max(1, Math.ceil(tileCount / atlasCols))
  const atlasWidth = atlasCols * input.tileWidth
  const atlasHeight = atlasRows * input.tileHeight
  const atlasPixels = new Uint8Array(atlasWidth * atlasHeight * 4)

  const helperCanvas = new OffscreenCanvas(input.tileWidth, input.tileHeight)
  const helperCtx = helperCanvas.getContext('2d', { willReadFrequently: true })
  if (!helperCtx) throw new Error('2D context unavailable for tile build')
  helperCtx.imageSmoothingEnabled = true
  helperCtx.imageSmoothingQuality = 'high'

  let featureLength = 0
  let allFeatures: Float32Array | null = null
  const rowWidthBytes = input.tileWidth * 4
  reportProgress(0, tileCount, 'Building tile set...')
  for (let i = 0; i < input.files.length; i += 1) {
    ensureNotCanceled()
    const bitmap = await fileToImageBitmap(input.files[i], input.tileWidth, input.tileHeight)
    helperCtx.clearRect(0, 0, input.tileWidth, input.tileHeight)
    helperCtx.drawImage(bitmap, 0, 0, input.tileWidth, input.tileHeight)
    bitmap.close()

    const imageData = helperCtx.getImageData(0, 0, input.tileWidth, input.tileHeight)
    const feat = wasm.extract_features_rgb(
      imageData.data,
      input.tileWidth,
      input.tileHeight,
      input.precision,
      input.colorModel,
    )
    if (!allFeatures) {
      featureLength = feat.length
      allFeatures = new Float32Array(tileCount * featureLength)
    }
    allFeatures.set(feat, i * featureLength)

    const tx = i % atlasCols
    const ty = Math.floor(i / atlasCols)
    for (let y = 0; y < input.tileHeight; y += 1) {
      const srcRow = y * rowWidthBytes
      const dstRow = ((ty * input.tileHeight + y) * atlasWidth + tx * input.tileWidth) * 4
      atlasPixels.set(imageData.data.subarray(srcRow, srcRow + rowWidthBytes), dstRow)
    }
    reportProgress(i + 1, tileCount, `Building tile set... ${i + 1}/${tileCount}`)
  }

  const meta = createMeta(input, tileCount, atlasCols, atlasRows, featureLength)
  return {
    meta,
    featuresBuffer: toArrayBuffer((allFeatures ?? new Float32Array(0)).buffer),
    atlasPixelsBuffer: toArrayBuffer(atlasPixels.buffer),
  }
}

workerScope.onmessage = (event: MessageEvent<BuildAtlasWorkerCommand>) => {
  const message = event.data
  if (message.type === 'cancel') {
    canceled = true
    return
  }

  void (async () => {
    try {
      const payload = await buildAtlasInWorker(message.payload)
      postEvent(
        {
          type: 'done',
          payload,
        },
        [payload.featuresBuffer, payload.atlasPixelsBuffer],
      )
    } catch (err) {
      postEvent({
        type: 'error',
        message: err instanceof Error ? err.message : String(err),
      })
    }
  })()
}

export {}
