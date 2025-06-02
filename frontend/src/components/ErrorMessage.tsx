import React from 'react';

interface ErrorMessageProps {
    message: string;
    className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, className = '' }) => {
    return (
        <div className={`bg-red-500/10 border-2 border-red-500 rounded-lg p-4 text-center text-red-500 ${className}`}>
            {message}
        </div>
    );
};

export default ErrorMessage; 