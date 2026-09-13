/**
 * Mengompres gambar di sisi browser sebelum disimpan sebagai base64.
 * Logo cukup ditampilkan kecil (di kop surat, header, dsb), jadi resolusi
 * tinggi tidak diperlukan. Fungsi ini mengecilkan dimensi gambar dan
 * mengompres kualitasnya supaya ukuran base64 akhir jauh lebih kecil
 * (biasanya di bawah 50-100KB, dibanding foto asli yang bisa berMB-MB).
 *
 * @param file       File gambar dari <input type="file">
 * @param maxDimension  Lebar/tinggi maksimum hasil akhir (px)
 * @param quality    Kualitas kompresi JPEG (0.0 - 1.0)
 */
export function compressImageFile(
  file: File,
  maxDimension = 300,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Berkas yang dipilih bukan gambar.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        // Hitung ulang dimensi agar sisi terpanjang tidak melebihi maxDimension,
        // tetap menjaga rasio aspek gambar asli.
        if (width > height && width > maxDimension) {
          height = Math.round(height * (maxDimension / width));
          width = maxDimension;
        } else if (height >= width && height > maxDimension) {
          width = Math.round(width * (maxDimension / height));
          height = maxDimension;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Browser tidak mendukung pemrosesan gambar (canvas).'));
          return;
        }

        // Latar putih dulu supaya PNG transparan tidak jadi hitam saat dikonversi ke JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      img.onerror = () => reject(new Error('Gagal memuat gambar. Coba file lain.'));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Gagal membaca berkas.'));
    reader.readAsDataURL(file);
  });
}
