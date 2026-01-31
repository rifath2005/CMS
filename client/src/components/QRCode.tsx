import { QRCodeSVG } from 'qrcode.react'

interface QRCodeProps {
    value: string
    size?: number
}

const QRCode: React.FC<QRCodeProps> = ({ value, size = 300 }) => {
    return (
        <div className="flex justify-center bg-white p-4 rounded-lg">
            <QRCodeSVG
                value={value}
                size={size}
                level="H"
                includeMargin={true}
                bgColor="#ffffff"
                fgColor="#000000"
            />
        </div>
    )
}

export default QRCode
