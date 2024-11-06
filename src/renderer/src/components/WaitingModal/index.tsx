import { Modal, Spin } from 'antd'
import React from 'react'

type WaitingModalProps = {
  visible: boolean // per controllare la visibilità del modale
  onCancel: () => void // funzione di callback per chiudere il modale
}

const WaitingModal: React.FC<WaitingModalProps> = ({ visible, onCancel }) => {
  return (
    <Modal title="Attendere prego..." open={visible} footer={null} onCancel={onCancel} centered>
      <div style={{ textAlign: 'center' }}>
        <Spin size="large" /> {}
        <p>Elaborazione in corso...</p>
      </div>
    </Modal>
  )
}

export default WaitingModal
