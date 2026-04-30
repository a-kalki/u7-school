export interface Lesson {
	title: string;
	originalFile: string;
	fileName: string;
	url: string;
	mdFile?: string;
	summary?: string;
	}
export interface Section {
	topic: string;
	lessons: Lesson[];
}

export interface Course {
	name: string;
	sections: Section[];
}

export interface ParserOptions {
	force?: boolean;
	onlyNew?: boolean;
	course?: string;
}
