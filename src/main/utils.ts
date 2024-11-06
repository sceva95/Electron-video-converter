import ffprobePath from 'ffprobe-static'
import util from 'util'
import { exec } from 'child_process'

const execPromise = util.promisify(exec)

export function isVideoFile(filePath) {
  const videoExtensions = [
    '.mp4',
    '.m4v',
    '.mkv',
    '.avi',
    '.mov',
    '.flv',
    '.wmv',
    '.webm',
    '.mpeg',
    '.mpg'
  ]

  const extension = filePath.split('.').pop().toLowerCase()

  return videoExtensions.includes(`.${extension}`)
}

export async function getVideoInfo(filePath) {
  const command = `${ffprobePath.path} -v error -show_entries format=duration,size,bit_rate,format_name,tags -show_entries stream=codec_name,codec_type,sample_rate,channels,width,height,bit_rate  -show_entries stream_tags=language -of json "ftp://dietpi:plasma@192.168.1.64${filePath}"`

  try {
    const { stdout, stderr } = await execPromise(command)
    if (stderr) {
      console.error(`FFprobe stderr: ${stderr}`)
    }
    const { format, streams } = JSON.parse(stdout)

    const audioStreams = []
    const videoStreams: any = []
    const subtitleStreams: any = []

    streams.forEach((stream) => {
      if (stream.codec_type === 'audio') {
        if (
          !audioStreams.some(
            (existingStream) => JSON.stringify(existingStream) === JSON.stringify(stream)
          )
        ) {
          audioStreams.push({
            ...stream,
            language: stream.tags?.language || 'und',
            selected: audioStreams.length === 0
          })
        }
      } else if (stream.codec_type === 'video') {
        if (
          !videoStreams.some(
            (existingStream) => JSON.stringify(existingStream) === JSON.stringify(stream)
          )
        ) {
          videoStreams.push(stream)
        }
      } else if (stream.codec_type === 'subtitle') {
        if (
          !subtitleStreams.some(
            (existingStream) => JSON.stringify(existingStream) === JSON.stringify(stream)
          )
        ) {
          subtitleStreams.push({
            ...stream,
            language: stream.tags?.language || 'und'
          })
        }
      }
    })

    return {
      ...format,
      ...videoStreams[0],
      audio: audioStreams,
      video: videoStreams,
      subtitle: subtitleStreams,
      error: stderr
    }
  } catch (error: any) {
    console.error(`Error executing FFprobe: ${error.message}`)
    return { error: error }
  }
}

export const updateProgress = (event, percentage, processingTimes, remainingItems) => {
  const averageTime = processingTimes.reduce((acc, time) => acc + time, 0) / processingTimes.length
  const estimatedTimeLeft = Math.round((averageTime * remainingItems) / 1000)

  event.sender.send('progress-update', {
    percentage,
    estimatedTimeLeft
  })
}
