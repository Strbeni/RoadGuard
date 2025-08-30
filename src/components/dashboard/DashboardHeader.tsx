import { Bell, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardHeaderProps {
  isOpenForRequests: boolean;
  onToggleStatus: () => void;
  showOpenOnly: boolean;
  onToggleShowOpenOnly: () => void;
  sortBy: "status" | "distance" | "rating";
  onSortChange: (sortBy: "status" | "distance" | "rating") => void;
  filterBy: "nearby" | "mostRated";
  onFilterChange: (filterBy: "nearby" | "mostRated") => void;
}

function DashboardHeader({
  isOpenForRequests,
  onToggleStatus,
  showOpenOnly,
  onToggleShowOpenOnly,
  sortBy,
  onSortChange,
  filterBy,
  onFilterChange,
}: DashboardHeaderProps){
  return (
    <header className="h-20 bg-card border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center space-x-6">
        <h1 className="text-2xl font-bold text-primary">RoadGuard Admin</h1>
        
        <div className="flex items-center space-x-4">
          <Button
            variant={sortBy === "status" ? "default" : "outline"}
            size="sm"
            onClick={() => onSortChange("status")}
          >
            Status
          </Button>
          <Button
            variant={sortBy === "distance" ? "default" : "outline"}
            size="sm"
            onClick={() => onSortChange("distance")}
          >
            Distance
          </Button>
          <Button
            variant={sortBy === "rating" ? "default" : "outline"}
            size="sm"
            onClick={() => onSortChange("rating")}
          >
            Rating
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {filterBy === "nearby" ? "Near by" : "Most Rated"}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onFilterChange("nearby")}>
              Near by
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilterChange("mostRated")}>
              Most Rated
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="show-open-only"
            checked={showOpenOnly}
            onCheckedChange={() => onToggleShowOpenOnly()}
          />
          <label htmlFor="show-open-only" className="text-sm text-foreground">
            Show Open Only
          </label>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workshops..."
            className="pl-10 w-64"
          />
        </div>

        <Button
          variant={isOpenForRequests ? "default" : "destructive"}
          size="sm"
          onClick={onToggleStatus}
          className="flex items-center space-x-2"
        >
          <div
            className={`w-2 h-2 rounded-full ${
              isOpenForRequests ? "bg-success" : "bg-destructive"
            }`}
          />
          <span>{isOpenForRequests ? "Open for Request" : "Closed"}</span>
        </Button>

        <div className="relative">
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4" />
          </Button>
          <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
            3
          </Badge>
        </div>

        <Avatar>
          <AvatarImage src="/placeholder.svg" alt="Admin" />
          <AvatarFallback>AD</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
};

export default DashboardHeader;
