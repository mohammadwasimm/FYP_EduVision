import { MdEdit } from 'react-icons/md';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import { FiEye } from 'react-icons/fi';

const getInitials = (name = '') => {
  return name
    .split(' ')
    .map((n) => n[0] || '')
    .join('')
    .toUpperCase();
};

const columnsFactory = ({ onEdit = () => {}, onDelete = () => {}, onView = () => {} } = {}) => {
  return [
    {
      title: 'NAME',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-white)] text-xs font-semibold">
            {getInitials(record.name)}
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--color-text)]">{record.name}</p>
          </div>
        </div>
      ),
    },
    {
      title: 'ROLL NUMBER',
      dataIndex: 'rollNumber',
      key: 'rollNumber',
      width: 150,
      render: (value) => <span className="text-[var(--color-text)]">{value}</span>,
    },
    {
      title: 'CLASS',
      dataIndex: 'className',
      key: 'className',
      width: 120,
      render: (value) => <span className="text-[var(--color-text)]">{value}</span>,
    },
    {
      title: 'EMAIL',
      dataIndex: 'email',
      key: 'email',
      width: 150,
      render: (value) => <span className="text-[var(--color-text)] text-xs sm:text-sm">{value}</span>,
    },
    {
      title: 'STUDENT ID',
      dataIndex: 'studentId',
      key: 'studentId',
      width: 90,
      render: (value) => (
        <span className="inline-flex items-center bg-[var(--color-primary-50)] px-3 py-1 text-[11px] font-medium text-[var(--color-text)]">
          {value}
        </span>
      ),
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      align: 'center',
      width: 120,
      render: (_, record) => (
        <div className="flex justify-center">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center"
            aria-label={`Edit ${record.name}`}
            onClick={() => onEdit(record)}
          >
            <MdEdit className="w-5 h-5 text-[var(--color-gold)]" />
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center"
            aria-label={`Delete ${record.name}`}
            onClick={() => onDelete(record)}
          >
            <RiDeleteBin6Fill className="w-5 h-5 text-red-500" />
          </button>
          <button
            type="button"
            className="text-[var(--color-primary)] ml-1"
            aria-label={`View submitted papers for ${record.name}`}
            onClick={() => onView(record)}
          >
            <FiEye className="w-5 h-5 text-[var(--color-primary)]" />
          </button>
        </div>
      ),
    },
  ];
};

export default columnsFactory;
