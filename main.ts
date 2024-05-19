import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { htmlToMarkdown, requestUrl, sanitizeHTMLToDom } from 'obsidian';
// import { JSDOM } from 'jsdom'

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
	doscBaseUrl: string;
	aceId: string;
	acePw: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default',
	doscBaseUrl: '',
	aceId: '',
	acePw: ''
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');
		
		this.addCommand({
			id: 'test-get-html',
			name: 'test get html',
			callback: () => this.fetchDocsConent()
		})

		this.addCommand({
			id: 'convert-html-to-markdown',
			name: 'convert html to markdown',
			callback: () => this.convertHtmlToMarkdown()
		})
		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new TISettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async convertHtmlToMarkdown() {
		// 여기에 변환할 HTML 문자열을 입력합니다.
        const htmlString = `<h1>Hello World</h1><p>This is a simple HTML string.</p>`;
        
        // HTML을 Markdown으로 변환합니다.
        const markdown = htmlToMarkdown(htmlString);
        
        // 생성된 Markdown을 .md 파일로 저장합니다.
        const filePath = `/converted-file.md`;
        await this.app.vault.create(filePath, markdown);

        // 사용자에게 작업 완료를 알립니다.
        new Notice('HTML has been converted to Markdown and saved as a new file.');
	}
	
	async encodeCredentials(username: string, password: string): Promise<string> {
		const credentials: string = `${username}:${password}`;
		const encodeCredentials: string = Buffer.from(credentials).toString('base64');
		return encodeCredentials;
	}

	async fetchDocsConent() {
		const pageId = 826966264;
		console.log(this.settings.aceId);
		console.log(this.settings.acePw);
		const username = this.settings.aceId;
		const password = this.settings.aceId;

		const encodedCredentials: string = await this.encodeCredentials(this.settings.aceId, this.settings.acePw);

		const url = "https://docs.ahnlab.com/pages/viewpage.action?pageId=" + pageId
		console.log(url)

		console.log(encodedCredentials)

		try {
			const response = await requestUrl({
				url: url,
				headers: {
					Authorization: `Basic ${encodedCredentials}`
				}
			});

			const htmlText: string = response.text;
			
			const documentFragment: DocumentFragment = sanitizeHTMLToDom(htmlText)
			const mainContentElement = documentFragment.querySelector('#main-content');
			
			if (mainContentElement) {
				console.log(mainContentElement.outerHTML)
				
				const mainContentHTML: string = mainContentElement.outerHTML;
				const markdown: string = htmlToMarkdown(mainContentHTML);

				const filePath = `/converted-file.md`;
        		await this.app.vault.create(filePath, markdown);
			}

			// const dom = new JSDOM(htmlText);
			// const docsDocument = dom.window.document;

			// const mainContentElement = document.getElementById('main-content');

			// if (mainContentElement) {
			// 	console.log('main-content : ', mainContentElement.textContent);
			// } else {
			// 	console.log('cant find main-content');
			// }
			
		} catch (error) {
			// 오류 처리
			console.log('get content err: ', error.message);
			console.log(error.body);
		}
		
		// const options = {
		// 	auth: `${this.settings.aceId}:${this.settings.acePw}`
		// };

		// const url = "https://docs.ahnlab.com/pages/viewpage.action?pageId=" + pageId

		// try {
		// 	const response: AxiosResponse = await axios.get(url, {
		// 		auth: {
		// 			username: this.settings.aceId,
		// 			password: this.settings.acePw
		// 		}
		// 	});

		// 	console.log('응답 데이터: ', response.data);
		// } catch (error){
		// 	console.error('get docs content err: ', error.message);
		// }
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class TISettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		
		new Setting(containerEl)
			.setName("Base Docs Url")
			.setDesc("Specify the root docs directory path. Sync all docs pages under this location.")
			.addText(text => text
				.setPlaceholder('Enter Docs Url')
				.setValue(this.plugin.settings.doscBaseUrl)
				.onChange(async (value) => {
					this.plugin.settings.doscBaseUrl = value;
					await this.plugin.saveSettings();
				})
			)
		
		containerEl.createEl('h2', { text: 'ACE Auth' });
		new Setting(containerEl)
			.setName("ACE ID")
			.setDesc("ace id")
			.addText(text => text
				.setPlaceholder('Enter ACE ID')
				.setValue(this.plugin.settings.aceId)
				.onChange(async (value) => {
					console.log('ACE ID: ' + value);
					this.plugin.settings.aceId = value;
					await this.plugin.saveSettings();
				})
			)
		new Setting(containerEl)
			.setName("ACE PW")
			.setDesc("ace pw")
			.addText(text => {
				text.inputEl.type ='password';
				text
				.setPlaceholder('Enter ACE PW')
				.setValue(this.plugin.settings.acePw)
				.onChange(async (value) => {
					console.log('ACE PW: ' + value);
					this.plugin.settings.acePw = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
