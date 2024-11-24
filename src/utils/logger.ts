import * as winston from 'winston'
import 'winston-daily-rotate-file'
const { align, colorize, combine, errors, printf, timestamp } = winston.format

const logger = winston.createLogger({
    level: 'info',
    format: combine(
        colorize({
            all: true,
        }),
        errors({
            stack: true,
        }),
        timestamp({
            format: `YYYY-MM-DD HH:mm:ss`,
        }),
        align(),
        printf((info) => `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`)
    ),
    transports: [
        new winston.transports.DailyRotateFile({
            datePattern: 'YYYY-MM-DD',
            filename: './logs/error-%DATE%.log',
            level: 'error',
            maxFiles: '14d',
        }),
        new winston.transports.DailyRotateFile({
            datePattern: 'YYYY-MM-DD',
            filename: './logs/combined-%DATE%.log',
            maxFiles: '14d',
        })
    ],
    exceptionHandlers: [
        new winston.transports.File({
            filename: './logs/exception.log',
        }),
    ],
    rejectionHandlers: [
        new winston.transports.File({
            filename: './logs/rejection.log',
        }),
    ]
})

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.cli(),
    }))
}

export default logger