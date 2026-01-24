import Swal from 'sweetalert2';

export const showSuccess = (message: string) => {
  Swal.fire({
    icon: 'success',
    title: 'Success',
    text: message,
    timer: 2000,
    showConfirmButton: false,
  });
};

export const showError = (message: string) => {
  Swal.fire({
    icon: 'error',
    title: 'Error',
    text: message,
  });
};

export const showConfirm = (message: string): Promise<boolean> => {
  return Swal.fire({
    title: 'Are you sure?',
    text: message,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes',
  }).then((result) => result.isConfirmed);
};

export const showInfo = (message: string) => {
  Swal.fire({
    icon: 'info',
    title: 'Info',
    text: message,
  });
};
