import moment from "moment";

export default class Image {
    public Accessibility: Accessibility;
    public AccessibilityLocked: boolean;
    public CheerCount: number;
    public CommentCount: number;
    public CreatedAt: moment.Moment;
    public Description: string;
    public EventId: number;
    public Id: number;
    public ImageName: string;
    public PlayerId: number;
    public RoomId: number;
    public TaggedPlayerIds: number[];
    public Type: Type;

    public constructor(image: any) {
        this.Accessibility = image.Accessibility;
        this.AccessibilityLocked = image.AccessibilityLocked;
        this.CheerCount = image.CheerCount;
        this.CommentCount = image.CommentCount;
        this.CreatedAt = moment(image.CreatedAt);
        this.Description = image.Description;
        this.EventId = image.PlayerEventId;
        this.Id = image.Id;
        this.ImageName = image.ImageName;
        this.PlayerId = image.PlayerId;
        this.RoomId = image.RoomId;
        this.TaggedPlayerIds = image.TaggedPlayerIds;
        this.Type = image.Type;
    }

    public get Url(): string {
        return `/image/${this.Id}`;
    }

    public get FormattedTime(): string {
        return this.CreatedAt.year() == moment().year()
            ? this.CreatedAt.format('MMM Do, h:mma')
            : this.CreatedAt.format('MMM Do YYYY, h:mma');
    }
}

export enum Accessibility {
    Private,
    Public,
    Friends
}

export enum Type {
    Unknown,
    Camera,
    Room,
    Outfit
}