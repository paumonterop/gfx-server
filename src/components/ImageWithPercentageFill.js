import React, { useRef, useEffect } from 'react';

const ImageWithPercentageFill = ({ imageUrl, percentage }) => {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;

    img.onload = function () {
      canvas.width = img.width;
      canvas.height = img.height;

      // Dibuja la imagen en el canvas
      ctx.drawImage(img, 0, 0);

      // Obtén los píxeles de la imagen
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Calcula el área que se va a pintar según el porcentaje
      const fillWidth = Math.floor((canvas.width * percentage) / 100);

      // Recorre los píxeles para pintar los negros en el área especificada
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < fillWidth; x++) {
          const index = (y * canvas.width + x) * 4;
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          const alpha = data[index + 3];

          // Si el píxel es negro (r, g, b son 0) y no es transparente
          if (r === 0 && g === 0 && b === 0 && alpha > 0) {
            // Cambia el color del píxel a (0, 203, 123)
            data[index] = 0;   // Rojo
            data[index + 1] = 203; // Verde
            data[index + 2] = 123; // Azul
          }
        }
      }

      // Vuelve a colocar los píxeles modificados en el canvas
      ctx.putImageData(imageData, 0, 0);
    };
  }, [imageUrl, percentage]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      <img ref={imgRef} src={imageUrl} alt="source" style={{ display: 'none' }} />
    </div>
  );
};

export default ImageWithPercentageFill;
