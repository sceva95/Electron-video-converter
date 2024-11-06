import React, { useState } from 'react'
import { Select, Table, TableColumnsType, Tooltip } from 'antd'
import { filesize } from 'filesize'
import { useFolderTree } from '../../context/FolderTreeContext'
import { FolderTreeNode } from '@/src/utils/type'
import { formatTime } from '../../utils'

type FolderTreeProps = {
  isLoading: boolean
  listVisualization: string
}

export const FolderTree: React.FC<FolderTreeProps> = ({ listVisualization, isLoading }) => {
  const { folderTree, flatFolderTree, setFolderTree } = useFolderTree()
  const [pageSize, setPageSize] = useState(10) // Imposta la dimensione della pagina
  const [currentPage, setCurrentPage] = useState(1)
  const data = listVisualization === 'flat' ? flatFolderTree : folderTree

  const findNode = (nodes, name) => {
    for (const node of nodes) {
      if (node.name === name) return node // Modifica qui se utilizzi un identificatore diverso
      const childNode = findNode(node.children || [], name)
      if (childNode) return childNode
    }
    return null // Se il nodo non è trovato
  }

  const onChangeResolution = (newResolution, node) => {
    const updateResolution = (currentNode) => {
      currentNode.resolution = newResolution
      if (currentNode.children) {
        currentNode.children.forEach(updateResolution)
      }
    }

    const updatedTree = [...folderTree]
    const nodeToUpdate = findNode(updatedTree, node.name)
    if (nodeToUpdate) {
      updateResolution(nodeToUpdate)
      setFolderTree(updatedTree)
    }
  }

  const onChangeAudioChannel = (indexOfChannelSelected, node) => {
    const updateAudioChannel = (currentNode) => {
      currentNode.audio.map((el, index) => {
        if (index === indexOfChannelSelected) {
          el.selected = true
        } else {
          el.selected = false
        }

        return el
      })
    }

    const updatedTree = [...folderTree]
    const nodeToUpdate = findNode(updatedTree, node.name)
    if (nodeToUpdate) {
      updateAudioChannel(nodeToUpdate)
      setFolderTree(updatedTree)
    }
  }

  const getSelectedKeys = (elements) => {
    let selectedKeys: any = []

    elements?.forEach((element) => {
      if (element?.selected) {
        selectedKeys.push(element.key)
      }
      if (element?.children && element.children.length > 0) {
        selectedKeys = selectedKeys.concat(getSelectedKeys(element.children))
      }
    })

    return selectedKeys
  }

  const rowSelection = {
    onChange: (selectedRowKeys) => {
      const currentTree = [...folderTree]

      const iterateElements = (elements, selected?) => {
        elements.forEach((element) => {
          element.selected =
            element.type === 'file'
              ? element.isVideo
                ? selected || selectedRowKeys.includes(element.key)
                : false
              : selected || selectedRowKeys.includes(element.key)
          if (element.children && element.children.length > 0) {
            iterateElements(element.children, element.selected)
          }
        })
        return elements
      }

      setFolderTree(iterateElements(currentTree))
    },
    getCheckboxProps: (record) => ({
      disabled: !record.isVideo && record.type === 'file',
      selected: record.selected,
      name: record.name
    })
  }

  const columns: TableColumnsType<FolderTreeNode> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      minWidth: 80,
      onHeaderCell: (column: any) => ({
        style: { width: column.minWidth, minWidth: column.minWidth }
      })
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      width: 100,
      onHeaderCell: (column: any) => ({
        style: { width: column.width, minWidth: column.minWidth }
      }),
      render: (size: number) => (size ? filesize(size) : undefined)
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      width: 120,
      onHeaderCell: (column: any) => ({
        style: { width: column.width, minWidth: column.minWidth }
      }),
      render: (value) => value && formatTime(Math.round(value))
    },
    {
      title: 'Codec Video',
      dataIndex: 'video',
      key: 'video',
      width: 120,
      align: 'center',
      onHeaderCell: (column: any) => ({
        style: { width: column.width, minWidth: column.minWidth }
      }),
      render: (videoStreams) => {
        if (videoStreams && videoStreams.length > 0) {
          return videoStreams.map((el) => `${el.codec_name}`)
        }
      }
    },
    {
      title: 'Video Resolution',
      dataIndex: 'video',
      key: 'video',
      width: 140,
      align: 'center',
      onHeaderCell: (column: any) => ({
        style: { width: column.width, minWidth: column.minWidth }
      }),
      render: (videoStreams) => {
        if (videoStreams && videoStreams.length > 0) {
          return videoStreams.map((el) => `${el.width}x${el.height}`)
        }
      }
    },
    {
      title: 'Audio',
      dataIndex: 'audio',
      key: 'audio',
      width: 80,
      onHeaderCell: (column: any) => ({
        style: { width: column.width, minWidth: column.minWidth }
      }),
      render: (audioStreams, item) => {
        if (audioStreams && audioStreams.length > 0) {
          const selectedIndex = audioStreams.findIndex((el) => el?.selected)
          return (
            <Select
              disabled={audioStreams.length === 1}
              size="small"
              style={{ width: '100%' }}
              defaultValue={0}
              value={selectedIndex > -1 ? selectedIndex : undefined}
              onChange={(event) => onChangeAudioChannel(event, item)}
            >
              {audioStreams.map((stream, index) => (
                <Select.Option key={index} value={index}>
                  {`${index + 1} - ${stream.codec_name}`}
                </Select.Option>
              ))}
            </Select>
          )
        }
      }
    },
    {
      title: 'Audio Language',
      dataIndex: 'language',
      key: 'language',
      width: 140,
      align: 'center',
      onHeaderCell: (column: any) => ({
        style: { width: column.width, minWidth: column.minWidth }
      }),
      render: (_, row) => row.audio?.find((el) => el.selected)?.language?.toUpperCase()
    },
    {
      title: 'Audio Channels',
      dataIndex: '',
      key: 'channels',
      align: 'center',
      width: 140,
      onHeaderCell: (column: any) => ({
        style: { width: column.width, minWidth: column.minWidth }
      }),
      render: (_, row) => {
        return row.audio?.find((el) => el.selected)?.channels
      }
    },
    {
      title: 'Audio Sample Rate',
      dataIndex: '',
      key: 'sample_rate',
      align: 'center',
      width: 160,
      onHeaderCell: (column: any) => ({
        style: { width: column.width, minWidth: column.minWidth }
      }),
      render: (_, row) => row.audio?.find((el) => el.selected)?.sample_rate
    },
    {
      title: 'Subtitle',
      dataIndex: 'subtitle',
      key: 'subtitle',
      width: 120,
      render: (subtitleStreams) => {
        if (subtitleStreams && subtitleStreams.length > 0) {
          const subtitlesText = subtitleStreams
            .map((stream, index) => `${index + 1}:${(stream?.language as string).toUpperCase()}`)
            .join(', ')

          return (
            <Tooltip title={subtitlesText}>
              <span
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'normal'
                }}
              >
                {subtitlesText}
              </span>
            </Tooltip>
          )
        }
      }
    },
    {
      title: 'Last Update',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      onHeaderCell: (column: any) => ({
        style: { width: column.width, minWidth: column.minWidth }
      })
    },
    {
      title: 'Action',
      key: 'operation',
      fixed: 'right',
      width: 100,
      onHeaderCell: (column: any) => ({
        style: { width: column.width, minWidth: column.minWidth }
      }),
      render: (item) =>
        (item.isVideo || item.type === 'directory') && (
          <Select
            size="small"
            value={item.resolution}
            options={[
              { value: 1080, label: '1080p' },
              { value: 720, label: '720p' }
            ]}
            style={{ marginLeft: 'auto' }}
            onChange={(event) => onChangeResolution(event, item)}
          >
            <option value={1080}>1080p</option>
            <option value={720}>720p</option>
          </Select>
        )
    }
  ]

  return (
    <Table<FolderTreeNode>
      loading={isLoading}
      size="small"
      pagination={{
        current: currentPage,
        pageSize: pageSize,
        total: data.length,
        onChange: (page, size) => {
          setCurrentPage(page)
          setPageSize(size || pageSize)
        },
        showSizeChanger: true,
        pageSizeOptions: ['10', '25', '50', '100']
      }}
      scroll={{ x: 'max-content', y: 'calc(100vh - 350px)' }}
      style={{ minHeight: '40vh' }}
      columns={columns}
      rowSelection={{
        ...rowSelection,
        checkStrictly: false,
        selectedRowKeys: getSelectedKeys(folderTree)
      }}
      dataSource={data}
    />
  )
}
