import Swal from 'sweetalert2';

function getSwalTheme() {
  const styles = getComputedStyle(document.documentElement);
  return {
    background: styles.getPropertyValue('--swal-bg').trim() || '#ffffff',
    color: styles.getPropertyValue('--swal-color').trim() || '#1f2937',
  };
}

export const notificationService = {
  error(title: string, text: string) {
    return Swal.fire({
      title,
      text,
      icon: 'error',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#4f46e5',
      ...getSwalTheme(),
      customClass: { popup: 'rounded-2xl', confirmButton: 'px-4 py-2 rounded-xl' },
    });
  },

  success(title: string, text?: string) {
    return Swal.fire({
      title,
      text,
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
      ...getSwalTheme(),
      customClass: { popup: 'rounded-2xl' },
    });
  },

  warning(title: string, text?: string) {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#4f46e5',
      ...getSwalTheme(),
      customClass: { popup: 'rounded-2xl', confirmButton: 'px-4 py-2 rounded-xl' },
    });
  },
};
