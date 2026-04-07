const path = require("path");
const { spawn } = require("child_process");

const pictureModel = require("../models/pictureModel");
const {
  resolveStorageAbsolutePath,
} = require("./qrScanStorage");

const PYTHON_EXECUTABLE = process.env.QR_PROCESSOR_PYTHON || "python";
const PYTHON_PROCESSOR_SCRIPT = path.join(
  __dirname,
  "CompleteQRProcessor",
  "process_qr_image.py"
);
const PROCESSING_POLL_INTERVAL_MS = 3000;

let workerTimer = null;
let workerStarted = false;
let processingLocked = false;

// Ham nay dung de chay Python processor voi anh goc va anh output duoc chi dinh.
// Nhan vao: inputPath la anh goc, outputPath la noi luu anh da xu ly.
// Tra ve: Promise resolve JSON stdout tu Python hoac reject neu script that bai.
const runPythonProcessor = (inputPath, outputPath) =>
  new Promise((resolve, reject) => {
    const pythonProcess = spawn(
      PYTHON_EXECUTABLE,
      [PYTHON_PROCESSOR_SCRIPT, "--input", inputPath, "--output", outputPath],
      {
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    let stdoutBuffer = "";
    let stderrBuffer = "";

    pythonProcess.stdout.on("data", (chunk) => {
      stdoutBuffer += chunk.toString();
    });

    pythonProcess.stderr.on("data", (chunk) => {
      stderrBuffer += chunk.toString();
    });

    pythonProcess.on("error", (error) => {
      reject(error);
    });

    pythonProcess.on("close", (exitCode) => {
      const normalizedStdout = stdoutBuffer.trim();

      try {
        if (normalizedStdout) {
          const parsedResult = JSON.parse(normalizedStdout.split(/\r?\n/).pop());

          if (exitCode === 0 && parsedResult.success) {
            resolve(parsedResult);
            return;
          }

          reject(
            new Error(
              parsedResult.message ||
                stderrBuffer.trim() ||
                `Python processor exited with code ${exitCode}.`
            )
          );
          return;
        }

        if (exitCode === 0) {
          resolve({
            success: true,
            mode: "unknown",
            message: "The Python processor completed without returning metadata.",
          });
          return;
        }

        reject(
          new Error(
            stderrBuffer.trim() ||
              `Python processor exited with code ${exitCode}.`
          )
        );
      } catch (error) {
        reject(
          new Error(
            stderrBuffer.trim() ||
              error.message ||
              "Unable to parse the Python processor output."
          )
        );
      }
    });
  });

// Ham nay dung de xu ly mot picture pending: claim record, goi Python va cap nhat ket qua vao DB.
// Nhan vao: picture la ban ghi can xu ly tu bang pictures.
// Tac dong: chuyen status sang PROCESSING, tao file ProcessedQRScan va danh dau PROCESSED/FAILED.
const processPendingPicture = async (picture) => {
  const claimed = await pictureModel.markPictureAsProcessing(
    picture.picture_id,
    "The Python QR processing worker is preparing the processed image."
  );

  if (!claimed) {
    return false;
  }

  const inputPath = resolveStorageAbsolutePath(picture.original_storage_path);
  const outputPath = resolveStorageAbsolutePath(picture.processed_storage_path);

  if (!inputPath || !outputPath) {
    await pictureModel.markPictureAsFailed(
      picture.picture_id,
      "The source or target image path is missing for this QR processing job."
    );
    return false;
  }

  try {
    const pythonResult = await runPythonProcessor(inputPath, outputPath);

    await pictureModel.markPictureAsProcessed(picture.picture_id, {
      processedFileName: picture.processed_file_name,
      processedStoragePath: picture.processed_storage_path,
      processedPublicUrl: picture.processed_public_url,
      processingStatus: "PROCESSED",
      processingNote:
        pythonResult.message ||
        "The processed QR image is ready in ProcessedQRScan.",
    });

    console.log(
      `QR Processor: Completed picture ${picture.picture_id} using ${pythonResult.mode || "python"}.`
    );
    return true;
  } catch (error) {
    await pictureModel.markPictureAsFailed(
      picture.picture_id,
      error.message || "The Python QR processing worker failed."
    );
    console.error(`QR Processor Error (${picture.picture_id}):`, error);
    return false;
  }
};

// Ham nay dung de quet queue PENDING va lan luot day anh vao Python processor.
// Nhan vao: khong nhan tham so nao.
// Tac dong: xu ly toi da mot nho anh pending moi chu ky de tranh chong cheo task.
const processPendingPictures = async () => {
  if (processingLocked) {
    return;
  }

  processingLocked = true;

  try {
    const pendingPictures = await pictureModel.findPendingScanPictures(3);

    if (!pendingPictures.length) {
      return;
    }

    for (const picture of pendingPictures) {
      await processPendingPicture(picture);
    }
  } catch (error) {
    console.error("QR Processing Worker Error (processPendingPictures):", error);
  } finally {
    processingLocked = false;
  }
};

// Ham nay dung de ep worker chay mot chu ky xu ly ngay lap tuc sau khi co anh moi.
// Nhan vao: khong nhan tham so nao.
// Tac dong: kich hoat ham quet queue ma khong can cho den chu ky polling tiep theo.
const requestQrProcessingCycle = () => {
  if (!workerStarted) {
    return;
  }

  void processPendingPictures();
};

// Ham nay dung de khoi dong worker polling DB tim anh QR chua xu ly.
// Nhan vao: khong nhan tham so nao.
// Tac dong: tao vong lap polling nen va chay mot lan ngay luc khoi dong server.
const startQrProcessingWorker = () => {
  if (workerStarted) {
    return;
  }

  workerStarted = true;
  void processPendingPictures();

  workerTimer = setInterval(() => {
    void processPendingPictures();
  }, PROCESSING_POLL_INTERVAL_MS);

  if (typeof workerTimer.unref === "function") {
    workerTimer.unref();
  }

  console.log("QR Processing Worker: Watching pending pictures for Python processing.");
};

module.exports = {
  requestQrProcessingCycle,
  runPythonProcessor,
  startQrProcessingWorker,
};
