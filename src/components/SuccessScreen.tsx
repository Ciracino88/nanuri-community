import Navbar from "./Navbar";

interface NavbarProps {
  userName?: string;
  onLogout?: () => void;
  onProfileEdit?: () => void;
}

interface Props {
  emoji: string;
  message: string;
  buttonText?: string;
  onButtonClick?: () => void;
  navbarProps: NavbarProps;
}

export default function SuccessScreen({ emoji, message, buttonText, onButtonClick, navbarProps }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar {...navbarProps} />
      <div className="flex flex-col items-center justify-center flex-1 gap-3 p-6">
        <p className="text-4xl">{emoji}</p>
        <p className="text-base font-medium text-gray-600">{message}</p>
        {buttonText && onButtonClick && (
          <button onClick={onButtonClick} className="text-sm text-blue-500 mt-2">
            {buttonText}
          </button>
        )}
      </div>
    </div>
  );
}
