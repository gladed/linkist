/** Return a type that includes only its public interface members of [Class]. */
export type PublicInterfaceOf<Class> = {
    [Member in keyof Class]: Class[Member];
};
