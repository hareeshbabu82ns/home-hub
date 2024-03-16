import MountainIcon from "@/components/MountainIcon";

const AppTitleLogo = () => {
  return (
    <div className="flex flex-1 items-center space-x-2 h-14">
      <MountainIcon stroke="red" className="h-6 md:h-8 w-6 md:w-8" />
      <h1 className="text-xl md:text-2xl font-bold text-primary">Logo</h1>
    </div>
  );
};

export default AppTitleLogo;
