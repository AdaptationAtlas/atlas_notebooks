import {
    ImageMagick,
    IMagickImage,
    initialize,
    MagickFormat,
  } from "https://deno.land/x/imagemagick_deno/mod.ts";
  
  // Initialize ImageMagick
  await initialize();
  
  // Get the file path from the command-line argument
  const filePath = Deno.args[0];
  
  if (!filePath) {
    console.error("Please provide a file path as an argument.");
    Deno.exit(1);
  }
  
  // Read the image file into a Uint8Array
  const data: Uint8Array = await Deno.readFile(filePath);
  
  // Process the image
  await ImageMagick.read(data, async (img: IMagickImage) => {
    // Crop the image to 800px width and 200px height from the top-left corner (x=0, y=0)
    img.crop(0, 0, 800, 200);
  
    // Construct the output file path by appending '-resized' to the original file name
    const outputPath = filePath.replace(/(\.[\w\d_-]+)$/i, '-resized$1');
  
    // Convert the image to WebP format and save it
    await img.write(
      MagickFormat.WebP,
      (data: Uint8Array) => Deno.writeFile(outputPath, data),
    );
    console.log('Image resized and saved as WebP to:', outputPath);
  });
