// @ts-nocheck
import sharp from "npm:sharp@0.33.0";

// Function to crop, resize, and convert image to WebP
async function cropAndConvertToWebP(inputPath: string, outputPath: string, width: number, height: number) {
  try {
    const image = sharp(inputPath);

    // Get the image metadata (including the format)
    const metadata = await image.metadata();

    // If the image is not already WebP, convert it
    if (metadata.format !== 'webp') {
      image.webpmotion(); // Convert the image to WebP
    }

    await image
      .resize(width, height) // Resize the image
      .extract({ width: width, height: height, left: 0, top: 0 }) // Crop the image
      .toFile(outputPath); // Save the output image

    const fileInfo = await Deno.stat(outputPath);
    const fileSizeKB = (fileInfo.size / 1024).toFixed(2);

    console.log(`Image successfully cropped, converted to WebP, and saved to: ${outputPath}`);
    console.log(`File size: ${fileSizeKB} KB`);
    console.log(`Image successfully cropped, converted to WebP, and saved to: ${outputPath}`);
  } catch (err) {
    console.error("Error processing the image:", err);
  }
}

// Parse command-line arguments
const args = Deno.args;

// Check for the right number of arguments
if (args.length !== 2) {
  console.error("Error: Invalid number of arguments.");
  console.log("Quarto Usage: quarto run cropToWebP.ts <inputPath> <outputPath>");
  console.log("Example: quarto run helpers/cropToWebP.ts 'default_im.webp' 'default_im_crop.webp'");
  Deno.exit(1);
}

// Extract arguments
const inputImagePath = args[0];
const outputImagePath = args[1]

// defaults for the atlas
const width = 800;
const height = 175;

cropAndConvertToWebP(inputImagePath, outputImagePath, width, height);