interface CardProps {
    title: string;
    value: string;
    color?: string;
  }
  
  const Card = ({ title, value, color = "text-blue-600" }: CardProps) => {
    return (
      <div className="bg-white shadow p-4 rounded-xl">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
      </div>
    );
  };
  
  export default Card;