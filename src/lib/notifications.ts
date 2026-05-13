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

  successWithConfirm(title: string, text?: string) {
    return Swal.fire({
      title,
      text,
      icon: 'success',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#4f46e5',
      ...getSwalTheme(),
      customClass: { popup: 'rounded-2xl', confirmButton: 'px-4 py-2 rounded-xl' },
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
  
  info(title: string, text: string) {
    return Swal.fire({
      title,
      text,
      icon: 'info',
      timer: 2000,
      showConfirmButton: false,
      ...getSwalTheme(),
      customClass: { popup: 'rounded-2xl' },
    });
  },

  async confirm(title: string, text: string): Promise<boolean> {
    const result = await Swal.fire({
      title,
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#9ca3af',
      ...getSwalTheme(),
      customClass: {
        popup: 'rounded-3xl',
        confirmButton: 'px-6 py-2.5 rounded-xl font-bold',
        cancelButton: 'px-6 py-2.5 rounded-xl font-bold'
      },
    });
    return result.isConfirmed;
  }
};
