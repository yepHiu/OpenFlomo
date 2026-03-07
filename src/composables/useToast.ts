import { useToast } from 'primevue/usetoast'

export function useAppToast() {
  const toast = useToast()

  const showSuccess = (summary: string, detail?: string) => {
    toast.add({
      severity: 'success',
      summary,
      detail,
      life: 3000
    })
  }

  const showError = (summary: string, detail?: string) => {
    toast.add({
      severity: 'error',
      summary,
      detail,
      life: 5000
    })
  }

  const showInfo = (summary: string, detail?: string) => {
    toast.add({
      severity: 'info',
      summary,
      detail,
      life: 3000
    })
  }

  const showWarn = (summary: string, detail?: string) => {
    toast.add({
      severity: 'warn',
      summary,
      detail,
      life: 4000
    })
  }

  return {
    toast,
    showSuccess,
    showError,
    showInfo,
    showWarn
  }
}
