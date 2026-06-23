import { Modal } from '../../ui/Modal.jsx';
import { ServiceSelectorByCategory } from './ServiceSelectorByCategory.jsx';

export function ServiceCategoryPickerModal({
  open,
  title = 'Seleccionar servicio',
  services = [],
  selectedValue = '',
  onSelect,
  onClose,
}) {
  return (
    <Modal open={open} title={title} onClose={onClose} className="admin-service-picker-modal">
      <ServiceSelectorByCategory
        services={services}
        selectedValue={selectedValue}
        onSelect={(value, service) => {
          onSelect(value, service);
          onClose?.();
        }}
      />
    </Modal>
  );
}
