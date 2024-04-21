
interface App {
	appid: number,
	name: string
}

async function getApps(): Promise<App[]> {
	const res = await fetch("https://api.steampowered.com/ISteamApps/GetAppList/v2/");
	const json = await res.json();

	return json.applist.apps as App[];
}

async function main() {
	const apps = await getApps();


	console.log(apps.length)
}

main().then(() => console.log("done"))