import React from 'react';

interface SuccessMessageProps {
    message: string;
    className?: string;
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({ message, className = '' }) => {
    return (
        <div className={`bg-green-500/10 border-2 border-green-500 rounded-lg p-4 text-center text-green-500 ${className}`}>
            {message}
        </div>
    );
};

export default SuccessMessage; 