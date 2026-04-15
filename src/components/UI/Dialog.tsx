import { useDialogStore } from '@/store/dialogStore';

export function Dialog() {
  const { dialog, closeDialog } = useDialogStore();
  
  if (!dialog.isOpen) return null;
  
  const getIcon = () => {
    switch (dialog.type) {
      case 'info':
        return (
          <div className="w-12 h-12 rounded-full bg-blue-900/50 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="w-12 h-12 rounded-full bg-yellow-900/50 flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-12 h-12 rounded-full bg-red-900/50 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'success':
        return (
          <div className="w-12 h-12 rounded-full bg-green-900/50 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };
  
  const getButtonStyle = (variant?: string) => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-br from-amber-600/80 to-amber-700/80 hover:from-amber-500/90 hover:to-amber-600/90 text-white border-amber-500/40';
      case 'danger':
        return 'bg-gradient-to-br from-red-900/80 to-red-800/80 hover:from-red-800/90 hover:to-red-700/90 text-white border-red-600/40';
      case 'secondary':
      default:
        return 'bg-stone-800/80 hover:bg-stone-700/80 text-amber-200 border-amber-900/30';
    }
  };
  
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closeDialog}
      />
      
      {/* 对话框 */}
      <div className="relative bg-gradient-to-br from-stone-900 to-stone-950 rounded-xl border-2 border-amber-800/50 shadow-2xl w-[400px] max-w-[90vw] overflow-hidden">
        {/* 标题栏 */}
        <div className="flex justify-between items-center p-4 border-b border-amber-800/30 bg-stone-900/50">
          <h3 className="text-lg font-bold text-amber-100" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>
            {dialog.title}
          </h3>
          <button 
            onClick={closeDialog}
            className="text-amber-400 hover:text-amber-300 text-xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-amber-900/30 transition-colors"
          >
            ×
          </button>
        </div>
        
        {/* 内容区域 */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            {getIcon()}
            <div className="flex-1">
              <p className="text-amber-100 text-base leading-relaxed" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>
                {dialog.message}
              </p>
            </div>
          </div>
        </div>
        
        {/* 按钮区域 */}
        {dialog.buttons && dialog.buttons.length > 0 && (
          <div className="flex justify-end gap-3 p-4 border-t border-amber-800/30 bg-stone-900/30">
            {dialog.buttons.map((button, index) => (
              <button
                key={index}
                onClick={button.onClick}
                className={`px-5 py-2 rounded-lg font-medium transition-all border ${getButtonStyle(button.variant)}`}
                style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}
              >
                {button.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
