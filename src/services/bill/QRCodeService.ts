import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

export interface QRCodeData {
  orderId: string;
  validationToken: string;
  userId: string;
  vendorId: string;
  timestamp: string;
}

export interface QRCodeGenerationResult {
  qrCodeDataUrl: string;
  qrCodeData: QRCodeData;
  validationToken: string;
}

export class QRCodeService {
  /**
   * Generate QR code for order
   */
  async generateQRCode(
    orderId: string,
    userId: string,
    vendorId: string
  ): Promise<QRCodeGenerationResult> {
    const validationToken = uuidv4();

    const qrCodeData: QRCodeData = {
      orderId,
      validationToken,
      userId,
      vendorId,
      timestamp: new Date().toISOString()
    };

    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrCodeData), {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2
    });

    return {
      qrCodeDataUrl,
      qrCodeData,
      validationToken
    };
  }

  /**
   * Parse QR code data
   */
  parseQRCode(qrCodeString: string): QRCodeData {
    try {
      const data = JSON.parse(qrCodeString);
      
      if (!data.orderId || !data.validationToken || !data.userId || !data.vendorId) {
        throw new Error('Invalid QR code data structure');
      }

      return data as QRCodeData;
    } catch (error) {
      throw new Error('Failed to parse QR code data');
    }
  }

  /**
   * Verify QR code data integrity
   */
  verifyQRCodeData(qrCodeData: QRCodeData): boolean {
    // Check required fields
    if (!qrCodeData.orderId || !qrCodeData.validationToken || 
        !qrCodeData.userId || !qrCodeData.vendorId || !qrCodeData.timestamp) {
      return false;
    }

    // Verify timestamp is valid
    const timestamp = new Date(qrCodeData.timestamp);
    if (isNaN(timestamp.getTime())) {
      return false;
    }

    return true;
  }

  /**
   * Generate validation token
   */
  generateValidationToken(): string {
    return uuidv4();
  }
}
