const Header = () => {
  return (
    <header className="bg-white shadow p-4 flex justify-between items-center">
      <h2 className="text-xl font-semibold text-gray-800">Administration page</h2>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gray-300 rounded-full" />
        <span className="text-sm font-medium text-gray-700">Admin</span>
      </div>
    </header>
  );
};

export default Header;